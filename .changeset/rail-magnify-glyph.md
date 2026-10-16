---
"@codeatlasdev/ui": patch
---

`Rail`: the dock magnification scales the module icon (the glyph), not the whole button, so the hovered background no longer covers the active neighbour's background and pip. The effect follows `--ca-motion-scale`: it is off with `motion: { scale: 0 }` and under `prefers-reduced-motion`.
