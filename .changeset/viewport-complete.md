---
"@codeatlasdev/ui": minor
---

Viewport hardening:
- `--ca-vh-min` (small viewport, `svh` with `vh` fallback) for full-screen sections, so a hero never hides its call to action behind the browser UI.
- Focus is never obscured by sticky chrome: `scroll-padding-block` on `:root` accounts for the header, safe areas and `--ca-sticky-top` / `--ca-sticky-bottom`.
- Prose heading anchors are always visible on touch screens (no hover-only affordance).
- BottomNav labels use an 11px floor.
- SimpleTable `responsive="cards"` captions every cell with its column header automatically; `data-label` only overrides.
- `caThemeHandle` warns in dev when the viewport meta blocks zoom (`user-scalable=no`, `maximum-scale=1`).
