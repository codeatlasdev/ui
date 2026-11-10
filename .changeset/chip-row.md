---
"@codeatlasdev/ui": minor
---

New `ChipRow`: a horizontally scrolling row of `Chip`s that keeps their 44px touch hit area. A scroller clips the invisible overhang a chip uses on touch, so taps just above or below a chip missed; under `pointer: coarse` the row now reserves that room (cancelled by a negative margin, so the layout height does not change). It is a `role="group"` with a `label`, hides the scrollbar, contains horizontal overscroll, and takes `size`, `fade` and `wrap`.
