---
"@codeatlasdev/ui": patch
---

`SiteHeader` and `GlassAppBar` no longer become the containing block of `position: fixed` descendants. Their blur moved from the header element to a `::before` layer (new `data-ca-blur-layer="<role>"` attribute, same roles as `data-ca-blur`), so a mobile menu panel `fixed; inset: <top> 0 0` inside a glass header measures the viewport instead of collapsing to the header box. Look is unchanged.
