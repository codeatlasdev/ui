---
"@codeatlasdev/ui": minor
---

Theme option `motion: { enter: "none" }` (token `--ca-enter-scale: 0`) turns off entrance and exit animations only: `Dialog`, `AlertDialog`, `Drawer`, `Sheet`, `Lightbox`, `CommandPalette`, `DocsSearch`, date pickers, `DropdownMenu`, `Popover`, `Tooltip` and `Toast` appear and leave in place, while hover and focus color transitions keep `--ca-duration-*`. New derived tokens `--ca-enter-fast`, `--ca-enter-base` and `--ca-enter-slow`; `MotionStage` demos render their final state when the theme turns entrances off, as under `prefers-reduced-motion` (#268).
