---
"@codeatlasdev/ui": patch
---

The `<dialog>` panel of `Dialog`, `AlertDialog`, `Drawer` and `Sheet` is no longer a Tab stop (`tabindex="-1"`): in WebKit, after a blur, the first Tab landed on the panel itself with no visible focus (#1059). When keyboard focus does land on a panel (no focusable child, `initialFocus: "container"`, a script), it now draws the focus ring (`--ca-focus-ring`, inset) instead of `outline: none`.
