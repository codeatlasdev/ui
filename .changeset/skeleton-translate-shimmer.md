---
"@codeatlasdev/ui": patch
---

Skeleton's shimmer is a translated `::after` band instead of an animated `background-position`, so it no longer repaints on every frame. Reduced motion still gets a static, dimmed placeholder.
