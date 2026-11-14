---
"@codeatlasdev/ui": patch
---

`reducedMotion` is `true` on the server: SSR and prerendered markup render without motion (for example `data-no-motion` on `SegmentedControl`), so people who asked for reduced motion no longer see animations until hydration. On the client the store reads `prefers-reduced-motion` as soon as it loads, so a page that never calls `init()` still gets the real value and hydration repairs the server snapshot; `init()` still follows later changes. `reducedTransparency` is unchanged (`false` on the server).
