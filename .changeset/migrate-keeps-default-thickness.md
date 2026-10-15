---
"@codeatlasdev/ui": patch
---

`migrate` keeps the default thickness of `GlassCard` and `GlassSurface`: a usage without `thickness` (default `regular`) becomes `elevation={3}` instead of dropping it, so the migrated card keeps its fill, blur, shadow and rim (`Card` and `Surface` default to `elevation={1}`).
