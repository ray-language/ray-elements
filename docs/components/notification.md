# Notification

Toasts: notify(), updateNotification(), hideNotification(), clearNotifications(); shown in a ray-toaster (a polite live region in the top layer). ray-notification is usable on its own.

Import: `import "@raylang/elements/notification";` · Category: Feedback

## `<ray-notification>` (RayNotification, extends RayElement)

notify({ id, title, message, color, icon, loading, autoClose (ms, default 4000; false = stays), closable, withBorder, onClose }) returns its id. A color adds a status icon in that color: green/teal a check, red/pink an error, yellow/orange a warning, others info. The status icon and the loader are 1.5rem with a 1.5 stroke; set --ray-notification-icon-size and --ray-notification-icon-stroke to change them.

Properties:

- `label`: string. Title.
- `color`: string, reflects. Status color: tints the status icon (and a slotted icon's circle).
- `icon`: string. Status icon from the registry (default: from the color); "none" for no icon.
- `loading`: boolean, reflects. Shows a spinner (notify() does not auto-close it).
- `hideClose` (attribute `hide-close`): boolean, reflects. No close button.
- `withBorder` (attribute `with-border`): boolean, reflects. Draws a border.
- `actionLabel` (attribute `action-label`): string. Text of an action button (e.g. "Undo"); pressing it fires ray-action.

Events:

- `ray-close`: The close button was pressed.
- `ray-action`: The action button was pressed (notify() runs action.onClick and closes it).

Slots:

- (default): Message.
- `icon`: Your own icon, in a colored circle (replaces the status icon).

Parts (`::part()`):

- `status-icon`: The status icon.

## `<ray-toaster>` (RayToaster, extends RayElement)

Created by notify() when missing; add one yourself to choose its position. A stack (newest in front, older ones peeking behind) that spreads into a list on hover or keyboard focus; on touch screens a tap expands it, a tap outside collapses it, and a sideways swipe dismisses a toast. Auto-close pauses while expanded. Full width on phones.

Properties:

- `position`: `bottom-right` | `bottom-left` | `bottom-center` | `top-right` | `top-left` | `top-center`, default `bottom-right`, reflects. Corner of the stack.
- `limit`: number, default `5`. Maximum kept; the oldest go first.
- `visible`: number, default `3`. Toasts shown in the collapsed stack (the rest wait, hidden).
- `expand`: boolean, reflects. Always expanded: a list instead of a stack.
- `gap`: number, default `12`. Pixels between toasts when expanded.

Methods and properties:

- `expanded: boolean`: Whether the stack is spread out (set it to expand or collapse it).
- `layout(): void`: Places the toasts again (done automatically on changes).
- `raise(): void`: Brings the stack above everything else in the top layer.

Exports (from `@raylang/elements/notification` and `@raylang/elements`):

- `function notify(options?: NotifyOptions): string`: Shows a notification; returns its id.
- `function updateNotification(id: string, options?: NotifyOptions): boolean`: Changes a shown notification and restarts its auto-close.
- `function hideNotification(id: string): boolean`: Removes a notification.
- `function clearNotifications(): void`: Removes every notification.
- `function statusIcon(color: string): string`: The status icon a color gets: circle-check, circle-x, alert-triangle or info.

Types:

- `{ id?: string; title?: string; message?: string; color?: string; icon?: string; loading?: boolean; autoClose?: number | false; closable?: boolean; withBorder?: boolean; action?: { label: string; onClick?: () => void }; onClose?: () => void }`: Options of notify() and updateNotification().

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.6.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-row">
  <ray-button id="demo-notify" variant="default">Notify</ray-button>
  <ray-button id="demo-notify-undo" variant="default">With an action</ray-button>
  <ray-button id="demo-notify-load" variant="default">Loading → done</ray-button>
  <ray-button id="demo-notify-error" variant="light" color="red">Error</ray-button>
</div>
<div style="display: grid; gap: 0.75rem; max-width: 24rem">
  <ray-notification label="Build finished" color="green" with-border>ray-remote 0.4.1 is ready to publish.</ray-notification>
  <ray-notification label="Build failed" color="red" with-border>type error at 12:5: 'f' expects 2 argument(s)</ray-notification>
  <ray-notification label="Certificate expires soon" color="yellow" with-border>update.json is signed with a key that expires in 7 days.</ray-notification>
  <ray-notification label="New version" color="blue" with-border>ray 0.9 is available.</ray-notification>
  <ray-notification label="Uploading" loading hide-close with-border>bundle-macos-arm64.zip</ray-notification>
  <ray-notification label="Event created" action-label="Undo" with-border>Sunday, December 3 at 9:00 AM</ray-notification>
</div>
<p style="margin: 0.75rem 0 0; color: var(--ray-muted-foreground); font-size: var(--ray-font-size-sm)">Several toasts stack; hover (or tap, on touch screens) to spread them. Swipe one sideways to dismiss it.</p>
<script type="module">
  import { notify, updateNotification } from "@raylang/elements/notification";
  document.getElementById("demo-notify").addEventListener("click", () =>
    notify({ title: "Saved", message: "Your changes are on disk." }));
  document.getElementById("demo-notify-undo").addEventListener("click", () =>
    notify({ title: "Event created", message: "Sunday, December 3 at 9:00 AM", action: { label: "Undo", onClick: () => notify({ message: "Event removed." }) } }));
  document.getElementById("demo-notify-load").addEventListener("click", () => {
    const id = notify({ title: "Deploying", message: "Uploading the bundle…", loading: true, closable: false });
    setTimeout(() => updateNotification(id, { title: "Deployed", message: "ray-remote 0.4.1 is live.", loading: false, color: "green", closable: true }), 1500);
  });
  document.getElementById("demo-notify-error").addEventListener("click", () =>
    notify({ title: "Build failed", message: "type error at 12:5: 'f' expects 2 argument(s)", color: "red", autoClose: false }));
</script>
```
