# Textarea

A multi-line text field that can grow with its content. Form-associated.

Import: `import "@raylang/elements/textarea";` · Category: Inputs

## `<ray-textarea>` (RayTextarea, extends FieldControl)

Also forwards placeholder, autocomplete, minlength, maxlength, spellcheck and wrap. Initial value: the value attribute or the element's text.

Properties:

- `value`: string. Current value.
- `rows`: number, default `3`. Visible rows (minimum when autosize).
- `autosize`: boolean. Grows with the content.
- `maxRows` (attribute `max-rows`): number. With autosize: stop growing and scroll after this many rows.
- `name`: string. Form field name.
- `label`: string. Visible label.
- `description`: string. Help text.
- `descriptionPosition` (attribute `description-position`): `above` | `below`, default `above`, reflects. The description before the control (help first) or after it, with the error (fields in a row stay aligned).
- `error`: string. Error text.
- `required`: boolean. Required for form submission.
- `disabled`: boolean. Not editable nor submitted.
- `readonly`: boolean. Not editable, still submitted.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Font size.
- `variant`: `default` | `filled` | `unstyled`, default `default`, reflects. Box style.

Also the properties of FieldControl: `radius`.

Attributes (forwarded to the inner element):

- `placeholder`: Placeholder text.
- `autocomplete`: Forwarded to the inner textarea.
- `minlength`: Minimum length.
- `maxlength`: Maximum length.
- `wrap`: soft or hard.

Events:

- `input`: On every edit.
- `change`: When an edit is committed.

Parts (`::part()`):

- `textarea`: The inner <textarea>.
- `wrapper`: The box.

Vue `v-model`: `value` (updated on input).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">A comment with a character count</div>
<form class="demo-comment" id="demo-comment">
  <ray-avatar name="Ada Lovelace" color="pink" size="md"></ray-avatar>
  <div class="demo-comment-body">
    <ray-textarea id="demo-comment-text" name="comment" aria-label="Write a comment" placeholder="Write a comment… (⌘↵ to post)" autosize max-rows="8"></ray-textarea>
    <div class="demo-comment-bar">
      <span class="demo-muted" id="demo-comment-count">0 / 280</span>
      <span class="demo-actions"><ray-button variant="subtle" size="xs" type="reset">Cancel</ray-button><ray-button size="xs" type="submit" id="demo-comment-post" disabled>Post</ray-button></span>
    </div>
    <ul class="demo-comments" id="demo-comments"></ul>
  </div>
</form>

<div class="demo-caption">Autosize, rows and read-only</div>
<div class="demo-grid">
  <ray-textarea label="Autosize" description="Grows with the text, up to six rows." autosize max-rows="6">Type a few lines here and watch it grow.</ray-textarea>
  <ray-textarea label="Six rows" rows="6" placeholder="A fixed height, with a scrollbar when it overflows."></ray-textarea>
  <ray-textarea label="Release notes" readonly rows="4" description="Read-only: selectable and focusable, not editable.">1.27.39 — faster startup, per-page modules, and the sidebar keeps its scroll.</ray-textarea>
</div>

<div class="demo-caption">Variants, sizes and states</div>
<div class="demo-grid">
  <ray-textarea label="Filled" variant="filled" placeholder="Filled background"></ray-textarea>
  <ray-textarea label="Large" size="lg" placeholder="Larger text and padding"></ray-textarea>
  <ray-textarea label="Bio" required error="Tell us a little about yourself." placeholder="Required"></ray-textarea>
  <ray-textarea label="Disabled" disabled>Not editable, not submitted.</ray-textarea>
</div>

<script type="module">
  // Count and limit: the button follows, an error past 280.
  const form = document.getElementById("demo-comment");
  const text = document.getElementById("demo-comment-text");
  const post = document.getElementById("demo-comment-post");
  const count = document.getElementById("demo-comment-count");
  const MAX = 280;
  const check = () => {
    const n = (text.value ?? "").length;
    count.textContent = `${n} / ${MAX}`;
    count.toggleAttribute("data-over", n > MAX);
    text.error = n > MAX ? `${n - MAX} character${n - MAX === 1 ? "" : "s"} too many.` : "";
    post.disabled = n === 0 || n > MAX;
  };
  text.addEventListener("input", check);
  text.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !post.disabled) form.requestSubmit(); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const li = document.createElement("li");
    li.textContent = text.value;
    document.getElementById("demo-comments").prepend(li);
    text.value = "";
    check();
  });
  form.addEventListener("reset", () => queueMicrotask(check));
</script>
```
