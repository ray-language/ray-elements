# Password input

A password field with a button that shows or hides what was typed (Mantine's PasswordInput). Everything else is ray-input: label, description, error, sizes, validation, forms.

Import: `import "@raylang/elements/password-input";` · Category: Inputs

## `<ray-password-input>` (RayPasswordInput, extends RayInput)

autocomplete defaults to current-password: use new-password on sign-up and change forms. The toggle keeps the focus and the caret in the field.

Properties:

- `visible`: boolean, reflects. The password is shown as text.
- `showLabel` (attribute `show-label`): string, default `Show password`. Accessible name of the toggle while hidden.
- `hideLabel` (attribute `hide-label`): string, default `Hide password`. Accessible name of the toggle while shown.

Also the properties of RayInput (`<ray-input>`): `value`, `type`, `name`, `label`, `description`, `descriptionPosition`, `error`, `placeholder`, `required`, `disabled`, `readonly`, `size`, `radius`, `variant`.

Events:

- `ray-visibility-change` (detail `{ visible: boolean }`): The user showed or hid the password.

Parts (`::part()`):

- `toggle`: The show/hide button.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Sign in</div>
<form class="demo-auth" id="demo-signin">
  <ray-input name="email" label="Email" type="email" value="ada@ray.dev" autocomplete="username" required></ray-input>
  <ray-password-input name="password" label="Password" placeholder="Your password" required></ray-password-input>
  <div class="demo-auth-row"><ray-checkbox label="Keep me signed in" checked></ray-checkbox><a href="#password-input">Forgot password?</a></div>
  <ray-button type="submit" full-width>Sign in</ray-button>
  <span class="demo-muted" id="demo-signin-out"></span>
</form>

<div class="demo-caption">New password with a strength meter</div>
<div class="demo-auth">
  <ray-password-input id="demo-new-password" label="New password" autocomplete="new-password" description="At least 10 characters, with a number, a symbol and both cases." value="ray2026"></ray-password-input>
  <ray-progress id="demo-strength" value="0" size="sm" label="Password strength"></ray-progress>
  <ul class="demo-requirements" id="demo-requirements">
    <li data-rule="length"><ray-icon name="close"></ray-icon>10 characters or more</li>
    <li data-rule="number"><ray-icon name="close"></ray-icon>A number</li>
    <li data-rule="lower"><ray-icon name="close"></ray-icon>A lowercase letter</li>
    <li data-rule="upper"><ray-icon name="close"></ray-icon>An uppercase letter</li>
    <li data-rule="symbol"><ray-icon name="close"></ray-icon>A symbol ($, &amp;, +…)</li>
  </ul>
</div>

<div class="demo-caption">Variants, sizes and states</div>
<div class="demo-grid">
  <ray-password-input label="Filled" variant="filled" value="hunter2"></ray-password-input>
  <ray-password-input label="Shown" value="correct horse battery staple" visible></ray-password-input>
  <ray-password-input label="Large" size="lg" radius="xl" placeholder="Passphrase"></ray-password-input>
  <ray-password-input label="With an icon" placeholder="API token"><ray-icon slot="left" name="settings"></ray-icon></ray-password-input>
  <ray-password-input label="Error" value="1234" error="Too short: at least 10 characters."></ray-password-input>
  <ray-password-input label="Disabled" value="secret" disabled></ray-password-input>
</div>

<script type="module">
  // Sign in: the form data, without the password itself.
  const signin = document.getElementById("demo-signin");
  signin.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(signin);
    document.getElementById("demo-signin-out").textContent = `${data.get("email")} · password of ${String(data.get("password")).length} characters`;
  });

  // Strength: one point per rule met.
  const rules = {
    length: (v) => v.length >= 10,
    number: (v) => /\d/.test(v),
    lower: (v) => /[a-z]/.test(v),
    upper: (v) => /[A-Z]/.test(v),
    symbol: (v) => /[^A-Za-z0-9]/.test(v),
  };
  const input = document.getElementById("demo-new-password");
  const meter = document.getElementById("demo-strength");
  const check = () => {
    const v = input.value ?? "";
    let met = 0;
    for (const li of document.querySelectorAll("#demo-requirements li")) {
      const ok = rules[li.dataset.rule](v);
      met += ok;
      li.toggleAttribute("data-met", ok);
      li.querySelector("ray-icon").name = ok ? "check" : "close";
    }
    meter.value = (met / 5) * 100;
    meter.color = met <= 2 ? "red" : met <= 4 ? "yellow" : "teal";
  };
  input.addEventListener("input", check);
  customElements.whenDefined("ray-password-input").then(check);
</script>
```
