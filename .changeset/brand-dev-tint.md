---
"@codeatlasdev/ui": minor
---

`caBrandPlugin` takes `devTint` (`#rgb`, `#rrggbb` or `oklch(L C H)`): under `vite dev` the favicon and every icon draw the mark in that one color, under their own hash, so several apps open at once in dev have tabs you can tell apart. `vite build`, `vite preview` and `codeatlas-ui brand` ignore it and write the untinted set byte for byte; without `devTint` nothing changes. `generateBrand` and `brandUrls` take the same color as `tint`.
