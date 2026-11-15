---
"@codeatlasdev/ui": minor
---

`@codeatlasdev/ui/testing`: an opaque-overlay contract. `expectOpaqueSurface(el, { min })` waits for animations to settle and rejects when the element's fill (the computed `background-color` alpha times its own `opacity`) is below `min`, by default `OPAQUE_SURFACE_MIN` (0.9); it resolves with the alpha, and the message names the element, its computed color and the alpha. `surfaceAlpha(el)` reads that alpha, and `colorAlpha(color)` parses the alpha of every computed color form Chromium returns (`rgb()`, `rgba()`, `color(srgb …)`, `oklab()`/`oklch()` from `color-mix()`, `lab()`, `lch()`, `hsl()`, `hwb()`, hex, keywords), throwing a `TypeError` on what it cannot resolve instead of guessing opaque. The library now tests `Dialog`, `AlertDialog`, `Drawer`, `Sheet`, `Popover` and `DropdownMenu` against it in light and dark, on the default style and on `glass` and `frosted`.
