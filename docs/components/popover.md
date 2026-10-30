# Popover

A floating panel anchored to a trigger, in the top layer; closes on Escape and outside clicks.

Import: `import "@raylang/elements/popover";` · Category: Overlays

## `<ray-popover>` (RayPopover, extends Floating)

Positioned in JS (flip + shift to stay in the viewport). JS: show(), hide(), toggle().

Properties:

- `open`: boolean, reflects. Shown.
- `placement`: `bottom` | `bottom-start` | `bottom-end` | `top` | `top-start` | `top-end` | `left` | `left-start` | `left-end` | `right` | `right-start` | `right-end`, default `bottom`, reflects. Preferred side and alignment: top/bottom/left/right are sides of the screen; on top and bottom, -start/-end follow the writing direction (right to left, "bottom-start" lines up the right edges).
- `offset`: number, default `8`. Gap to the trigger in px.
- `width`: string. Panel width (px number or CSS length). Default: its content.
- `matchWidth` (attribute `match-width`): boolean. At least as wide as the trigger.
- `padding`: `0` | `xs` | `sm` | `md` | `lg`, default `md`, reflects. Panel padding.
- `trapFocus` (attribute `trap-focus`): boolean. Moves focus into the panel when opened and keeps Tab inside it.

Events:

- `ray-open`: After it opened.
- `ray-close`: After it closed (also by Escape or an outside click).

Slots:

- `trigger`: The element that toggles it (gets aria-haspopup and aria-expanded).
- (default): Panel content.

Parts (`::part()`):

- `dropdown`: The panel.

Methods and properties:

- `show(): void`: Opens it.
- `hide(): void`: Closes it.
- `toggle(): void`: Opens or closes it.
- `readonly trigger: Element | null`: The trigger element.

Vue `v-model`: `open` (updated on ray-open, ray-close).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.10.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Share, filters and a profile card</div>
<div class="demo-row demo-pop-row">
  <ray-popover placement="bottom-start" width="340" trap-focus aria-label="Share">
    <ray-button slot="trigger"><ray-icon slot="left" name="arrow-up-right"></ray-icon>Share</ray-button>
    <div class="demo-pop">
      <strong>Share “ray-remote”</strong>
      <div class="demo-pop-invite"><ray-input aria-label="Invite by email" placeholder="name@company.com" size="xs" type="email" id="demo-pop-email"></ray-input><ray-button size="xs" id="demo-pop-invite">Invite</ray-button></div>
      <ul class="demo-pop-people" id="demo-pop-people">
        <li><ray-avatar name="Ada Lovelace" color="pink" size="sm"></ray-avatar><span><b>Ada Lovelace</b><small>ada@ray.dev</small></span><em>Owner</em></li>
        <li><ray-avatar name="Alan Turing" color="blue" size="sm"></ray-avatar><span><b>Alan Turing</b><small>alan@ray.dev</small></span><em>Editor</em></li>
      </ul>
      <div class="demo-pop-link"><ray-icon name="paperclip"></ray-icon><span>ray.dev/p/ray-remote</span><ray-button size="xs" variant="default" id="demo-pop-copy"><ray-icon slot="left" name="copy"></ray-icon>Copy link</ray-button></div>
    </div>
  </ray-popover>

  <ray-popover id="demo-pop-filters" placement="bottom-start" width="260" trap-focus aria-label="Filters">
    <ray-button slot="trigger" variant="default"><ray-icon slot="left" name="settings"></ray-icon>Filters<ray-badge slot="right" size="xs" variant="filled" id="demo-pop-count">2</ray-badge></ray-button>
    <div class="demo-pop">
      <strong>Status</strong>
      <div class="demo-pop-checks" id="demo-pop-checks">
        <ray-checkbox label="Open" value="open" checked></ray-checkbox>
        <ray-checkbox label="In review" value="review" checked></ray-checkbox>
        <ray-checkbox label="Done" value="done"></ray-checkbox>
        <ray-checkbox label="Archived" value="archived"></ray-checkbox>
      </div>
      <div class="demo-pop-foot"><ray-button size="xs" variant="subtle" id="demo-pop-clear">Clear</ray-button><ray-button size="xs" id="demo-pop-apply">Apply</ray-button></div>
    </div>
  </ray-popover>

  <ray-popover placement="bottom" width="280">
    <button slot="trigger" type="button" class="demo-pop-user"><ray-avatar name="Grace Hopper" color="teal" size="sm"></ray-avatar>@grace</button>
    <div class="demo-pop demo-pop-card">
      <div class="head"><ray-avatar name="Grace Hopper" color="teal" size="lg"></ray-avatar><ray-button size="xs" variant="light">Follow</ray-button></div>
      <strong>Grace Hopper</strong>
      <span>Compiler engineer. Writes the parts of raylang nobody sees.</span>
      <dl><div><dt>Following</dt><dd>128</dd></div><div><dt>Followers</dt><dd>4.2k</dd></div></dl>
    </div>
  </ray-popover>
  <span class="demo-muted" id="demo-pop-out"></span>
</div>

<div class="demo-caption">Reactions</div>
<div class="demo-message">
  <ray-avatar name="Alan Turing" color="blue" size="sm"></ray-avatar>
  <div>
    <p><b>Alan Turing</b> <small>10:42</small><br>The new docs load in half the time. Nice work on the per-page modules!</p>
    <div class="demo-reactions" id="demo-reactions">
      <ray-popover placement="top-start" padding="xs" id="demo-react-pop">
        <ray-icon-button slot="trigger" size="sm" variant="default" label="Add a reaction"><ray-icon name="plus"></ray-icon></ray-icon-button>
        <div class="demo-emoji" id="demo-emoji">
          <button type="button">👍</button><button type="button">🎉</button><button type="button">🚀</button><button type="button">❤️</button><button type="button">👀</button><button type="button">😄</button>
        </div>
      </ray-popover>
    </div>
  </div>
</div>

<div class="demo-caption">Placements, width and padding</div>
<div class="demo-pop-placements">
  <ray-popover placement="top"><ray-button slot="trigger" size="xs" variant="light">top</ray-button><span class="demo-pop-tip">placement="top"</span></ray-popover>
  <ray-popover placement="right"><ray-button slot="trigger" size="xs" variant="light">right</ray-button><span class="demo-pop-tip">placement="right"</span></ray-popover>
  <ray-popover placement="bottom"><ray-button slot="trigger" size="xs" variant="light">bottom</ray-button><span class="demo-pop-tip">placement="bottom"</span></ray-popover>
  <ray-popover placement="left"><ray-button slot="trigger" size="xs" variant="light">left</ray-button><span class="demo-pop-tip">placement="left"</span></ray-popover>
  <ray-popover placement="bottom-start" match-width><ray-button slot="trigger" size="xs" variant="default">match-width: as wide as this button</ray-button><span class="demo-pop-tip">The same width as its trigger.</span></ray-popover>
  <ray-popover placement="bottom" padding="lg" offset="16"><ray-button slot="trigger" size="xs" variant="default">padding lg · offset 16</ray-button><span class="demo-pop-tip">More room, further away.</span></ray-popover>
</div>

<script type="module">
  // Share: invite adds a person; copy copies the link.
  const say = (t) => { document.getElementById("demo-pop-out").textContent = t; };
  document.getElementById("demo-pop-invite").addEventListener("click", () => {
    const email = document.getElementById("demo-pop-email");
    if (!email.value) return;
    const li = document.createElement("li");
    li.innerHTML = `<ray-avatar color="gray" size="sm"></ray-avatar><span><b></b><small>Invitation sent</small></span><em>Viewer</em>`;
    li.querySelector("ray-avatar").name = email.value;
    li.querySelector("b").textContent = email.value;
    document.getElementById("demo-pop-people").append(li);
    email.value = "";
  });
  document.getElementById("demo-pop-copy").addEventListener("click", (e) => {
    navigator.clipboard?.writeText("https://ray.dev/p/ray-remote").catch(() => {});
    say("Link copied.");
  });

  // Filters: the badge counts the checked ones; Apply closes the popover.
  const filters = document.getElementById("demo-pop-filters");
  const checks = [...document.querySelectorAll("#demo-pop-checks ray-checkbox")];
  const count = () => { const n = checks.filter((c) => c.checked).length; const b = document.getElementById("demo-pop-count"); b.textContent = String(n); b.hidden = n === 0; return n; };
  for (const c of checks) c.addEventListener("change", count);
  document.getElementById("demo-pop-clear").addEventListener("click", () => { for (const c of checks) c.checked = false; count(); });
  document.getElementById("demo-pop-apply").addEventListener("click", () => {
    say(`Status: ${checks.filter((c) => c.checked).map((c) => c.value).join(", ") || "any"}`);
    filters.hide();
  });

  // Reactions: a pick adds (or bumps) a chip next to the + button.
  const pop = document.getElementById("demo-react-pop");
  document.getElementById("demo-emoji").addEventListener("click", (e) => {
    const emoji = e.target.closest("button")?.textContent;
    if (!emoji) return;
    const box = document.getElementById("demo-reactions");
    let chip = [...box.querySelectorAll(".chip")].find((c) => c.dataset.emoji === emoji);
    if (!chip) {
      chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.emoji = emoji;
      chip.dataset.n = "0";
      chip.addEventListener("click", () => { chip.dataset.n = String(Number(chip.dataset.n) + 1); chip.textContent = `${emoji} ${chip.dataset.n}`; });
      box.insertBefore(chip, pop);
    }
    chip.dataset.n = String(Number(chip.dataset.n) + 1);
    chip.textContent = `${emoji} ${chip.dataset.n}`;
    pop.hide();
  });
</script>
```
