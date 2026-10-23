---
"@codeatlasdev/ui": patch
---

`MapStage`: fitting clear of a wide `PageFrame` no longer throws `Invalid LngLat object: (-Infinity, NaN)`. The stage set the map's padding and passed the same padding to `fitBounds`, which subtracted it twice and left a wide frame no area; the bounds now fit inside the visible area exactly once (#407).
