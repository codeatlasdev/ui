---
"@codeatlasdev/ui": patch
---

`PageFrame`: on mobile (<=900px) the full-screen panel and the bottom sheet no longer overflow the viewport by the frame gap with `side="left"`. The desktop `data-side` position rules out-ranked the mobile `inset: 0` reset, so the panel kept `left: 12px` with `width: 100%` (right edge 402px on 390px). Fixes #489.
