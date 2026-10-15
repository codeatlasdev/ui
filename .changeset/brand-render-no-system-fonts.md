---
"@codeatlasdev/ui": patch
---

`generateBrand` and the brand Vite plugin no longer load every system font for each PNG they render. resvg did that by default on every construction (~450 ms per render on Windows, ~2.7 s per icon set, at every build and dev start); fonts now load only when the mark has `<text>` (#120).
