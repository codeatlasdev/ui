---
"@codeatlasdev/ui": minor
---

`Drawer` gets `chromeless` and `fullBleedBelow` (#362), mirroring `Dialog`'s `chromeless`. `chromeless` renders no header, close button or footer actions and no body padding, so a detail view can bring its own header and scroll area; the panel is still named by `title` (screen readers only), `aria-label` or `aria-labelledby`. `fullBleedBelow="sm" | "md" | "lg"` makes a left/right panel exactly the viewport width and `--ca-vh` height below that breakpoint (no radius, border or page strip, safe-area padding kept). `.ca-drawer__body` is now a flex column with `min-height: 0`, so a child can own the scroll.
