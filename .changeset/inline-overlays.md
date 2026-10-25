---
"@codeatlasdev/ui": minor
---

`inline` on `Dialog`, `Sheet`, `Drawer`, `Popover`, `DropdownMenu` and `Toaster` renders the overlay in place instead of the top layer: `position: absolute` inside its container, never moved to `<body>`, no `showModal()` / `showPopover()`, no scroll lock, no focus trap, no inert page, no global Escape or outside-press ownership (Escape closes it from inside). It resolves the tokens of its container, so it follows a `data-preset` or `data-theme-scope` island. `openLayer` takes the same `inline` option. The Theme Studio overlays screen now shows the real components instead of static replicas.
