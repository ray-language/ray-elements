In a `std/ui` window opened as `full_content` (the page under a transparent title bar, macOS), with [the native bridge](RAYLANG.md#using-the-bridge), the header becomes the title bar: at least as tall, with room for the window buttons, and dragging it moves the window (buttons in it stay buttons). With `layout="alt"` or without a header, the navbar and the main content start below the title bar.

```ray
var o = ui.options(1100, 720);
o.kind = "full_content";
let h = ui.open_with("Builds", "ray://app/index.html", o)?;
```

The bridge also keeps the window's background and title bar in the theme's background, so switching to dark, resizing or reopening never flashes the other theme.
