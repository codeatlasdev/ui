---
"@codeatlasdev/ui": patch
---

A page with no `data-style` on `<html>` now renders as `data-style="solid"`, the package default: no backdrop blur, opaque surfaces, no glow, the pulsing skeleton. Before, an app without the theme plugin (no `themeScript`, no `caUI`) kept the glass tokens, so every `data-ca-blur` element (chips, tabs, toasts, rail, panels) blurred. Glass, frosted and the other styles are unchanged: set `data-style` to opt in.
