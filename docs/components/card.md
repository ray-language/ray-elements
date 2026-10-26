# Card

A surface for grouped content, with optional media, header and footer.

Import: `import "@raylang/elements/card";` · Category: Layout

## `<ray-card>` (RayCard, extends RayElement)

Properties:

- `padding`: `0` | `xs` | `sm` | `md` | `lg` | `xl`, default `md`, reflects. Inner spacing (named space scale).
- `radius`: `xs` | `sm` | `md` | `lg` | `xl`. Corner radius. Default: --ray-radius-default.
- `shadow`: `xs` | `sm` | `md` | `lg` | `xl`. Elevation.
- `withBorder` (attribute `with-border`): boolean. Draws a border.
- `variant`: `default` | `filled` | `outline`, default `default`, reflects. default: card surface; filled: muted surface; outline: border without fill.

Slots:

- (default): The body.
- `media`: Full-bleed image or media at the top.
- `header`: Header content.
- `footer`: Footer content (actions).

Parts (`::part()`):

- `card`: The surface.
- `header`: The header area.
- `body`: The body area.
- `footer`: The footer area.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.9.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">With media</div>
<div class="demo-card-grid">
  <ray-card with-border shadow="sm" radius="lg">
    <div slot="media" class="demo-card-media" style="--a: var(--ray-violet-light); --b: var(--ray-blue-light); --c: var(--ray-violet-light-color)"><ray-icon name="terminal" size="2.5rem" stroke="1.5"></ray-icon></div>
    <div class="demo-card-meta"><ray-badge variant="light" color="violet" size="sm">Guide</ray-badge><span>8 min read</span></div>
    <strong class="demo-card-title">Ship a native app with raylang</strong>
    <p class="demo-card-text">From ray new to a signed bundle: the webview, the update feed and the release checklist.</p>
    <div slot="footer" class="demo-card-author"><ray-avatar name="Ada Lovelace" color="pink" size="sm"></ray-avatar><span><b>Ada Lovelace</b><small>Oct 2, 2026</small></span></div>
  </ray-card>
  <ray-card with-border shadow="sm" radius="lg">
    <div slot="media" class="demo-card-media" style="--a: var(--ray-teal-light); --b: var(--ray-green-light); --c: var(--ray-teal-light-color)"><ray-icon name="folder" size="2.5rem" stroke="1.5"></ray-icon></div>
    <div class="demo-card-meta"><ray-badge variant="light" color="teal" size="sm">Template</ray-badge><span>Updated today</span></div>
    <strong class="demo-card-title">Dashboard starter</strong>
    <p class="demo-card-text">Sidebar, tables, charts and a settings modal, wired to a web backend.</p>
    <div slot="footer" class="demo-card-actions"><span class="demo-card-price">$0<small> · MIT</small></span><ray-button size="xs" variant="light"><ray-icon slot="left" name="download"></ray-icon>Use template</ray-button></div>
  </ray-card>
  <ray-card with-border shadow="sm" radius="lg">
    <div slot="media" class="demo-card-media" style="--a: var(--ray-orange-light); --b: var(--ray-yellow-light); --c: var(--ray-orange-light-color)"><ray-icon name="star" size="2.5rem" stroke="1.5"></ray-icon></div>
    <div class="demo-card-meta"><ray-badge variant="light" color="orange" size="sm">Release</ray-badge><span>v1.27</span></div>
    <strong class="demo-card-title">Per-page modules and faster docs</strong>
    <p class="demo-card-text">Every docs page now loads only the components it shows, and the menu keeps its place.</p>
    <div slot="footer" class="demo-card-actions"><a href="#card">Read the notes</a><ray-icon-button size="sm" variant="subtle" label="Save for later"><ray-icon name="bell"></ray-icon></ray-icon-button></div>
  </ray-card>
</div>

<div class="demo-caption">Profile and metrics</div>
<div class="demo-card-grid">
  <ray-card with-border radius="lg" padding="lg">
    <div class="demo-card-profile">
      <ray-avatar name="Grace Hopper" color="teal" size="xl"></ray-avatar>
      <strong>Grace Hopper</strong>
      <span>Compiler engineer · Arlington</span>
      <div class="demo-row"><ray-badge variant="outline" color="gray" size="sm" normal-case>raylang</ray-badge><ray-badge variant="outline" color="gray" size="sm" normal-case>compilers</ray-badge><ray-badge variant="outline" color="gray" size="sm" normal-case>COBOL</ray-badge></div>
      <dl class="demo-card-stats"><div><dt>Commits</dt><dd>1,284</dd></div><div><dt>Reviews</dt><dd>312</dd></div><div><dt>Streak</dt><dd>41 d</dd></div></dl>
    </div>
    <div slot="footer" class="demo-card-split"><ray-button size="sm" full-width>Follow</ray-button><ray-button size="sm" variant="default" full-width>Message</ray-button></div>
  </ray-card>
  <div class="demo-stack">
    <ray-card variant="filled" radius="lg">
      <div class="demo-card-kpi"><span>Monthly active users</span><strong>48,210</strong><ray-badge variant="light" color="green" size="sm" normal-case>+12.4% vs September</ray-badge></div>
    </ray-card>
    <ray-card with-border radius="lg">
      <div class="demo-card-kpi"><span>Storage</span><strong>62.4 <small>/ 100 GB</small></strong><ray-progress value="62" size="sm" label="Storage used"></ray-progress></div>
      <div slot="footer" class="demo-card-actions"><span class="demo-muted">Renews Nov 1</span><a href="#card">Upgrade</a></div>
    </ray-card>
  </div>
</div>

<div class="demo-caption">As a link</div>
<div class="demo-card-links">
  <a class="demo-card-link" href="#card"><ray-card with-border radius="md"><span class="ic" style="--c: var(--ray-blue-light-color); --b: var(--ray-blue-light)"><ray-icon name="file"></ray-icon></span><strong>Getting started</strong><span>Install, import, theme.</span><ray-icon class="go" name="arrow-up-right"></ray-icon></ray-card></a>
  <a class="demo-card-link" href="#card"><ray-card with-border radius="md"><span class="ic" style="--c: var(--ray-violet-light-color); --b: var(--ray-violet-light)"><ray-icon name="settings"></ray-icon></span><strong>Tokens</strong><span>Colors, spacing, radius, motion.</span><ray-icon class="go" name="arrow-up-right"></ray-icon></ray-card></a>
  <a class="demo-card-link" href="#card"><ray-card with-border radius="md"><span class="ic" style="--c: var(--ray-teal-light-color); --b: var(--ray-teal-light)"><ray-icon name="terminal"></ray-icon></span><strong>raylang extras</strong><span>Typed props and ray check.</span><ray-icon class="go" name="arrow-up-right"></ray-icon></ray-card></a>
</div>

<div class="demo-caption">A form, with the header and footer styled through ::part()</div>
<ray-card class="demo-card-form" with-border radius="lg" padding="lg">
  <div slot="header"><strong>Invite people</strong><span>They get an email with a link that expires in 7 days.</span></div>
  <div class="demo-card-fields">
    <ray-input label="Email" type="email" placeholder="ada@ray.dev"></ray-input>
    <ray-select label="Role" value="member"><option value="viewer">Viewer</option><option value="member">Member</option><option value="admin">Admin</option></ray-select>
  </div>
  <ray-switch label="Also give access to billing" size="sm"></ray-switch>
  <div slot="footer" class="demo-card-actions"><span class="demo-muted">3 of 10 seats used</span><span class="demo-row"><ray-button size="sm" variant="default">Cancel</ray-button><ray-button size="sm">Send invite</ray-button></span></div>
</ray-card>

<div class="demo-caption">Variants, shadows, radius and padding</div>
<div class="demo-card-matrix">
  <ray-card variant="default" with-border><strong>default</strong><span>card surface, with-border</span></ray-card>
  <ray-card variant="filled"><strong>filled</strong><span>muted surface</span></ray-card>
  <ray-card variant="outline"><strong>outline</strong><span>border, no fill</span></ray-card>
  <ray-card shadow="xs"><strong>shadow xs</strong><span>barely lifted</span></ray-card>
  <ray-card shadow="md"><strong>shadow md</strong><span>a raised panel</span></ray-card>
  <ray-card shadow="xl"><strong>shadow xl</strong><span>floating</span></ray-card>
  <ray-card with-border radius="xs" padding="xs"><strong>radius xs · padding xs</strong><span>dense</span></ray-card>
  <ray-card with-border radius="md" padding="md"><strong>radius md · padding md</strong><span>the defaults</span></ray-card>
  <ray-card with-border radius="xl" padding="xl"><strong>radius xl · padding xl</strong><span>roomy</span></ray-card>
</div>
```
