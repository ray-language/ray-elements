# Empty state

What a list, table or pane shows when it is empty: icon, title, text and the action that fills it.

Import: `import "@raylang/elements/empty-state";` · Category: Feedback

## `<ray-empty-state>` (RayEmptyState, extends RayElement)

Properties:

- `label`: string. Title.
- `compact`: boolean, reflects. Less padding.
- `withBorder` (attribute `with-border`): boolean, reflects. Dashed border.

Slots:

- (default): Text.
- `icon`: Icon, shown in a circle.
- `actions`: Buttons.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.7.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<ray-empty-state label="No projects yet" with-border>
  <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
  Create a project to start building with raylang.
  <ray-button slot="actions">New project</ray-button>
  <ray-button slot="actions" variant="default">Import</ray-button>
</ray-empty-state>
```
