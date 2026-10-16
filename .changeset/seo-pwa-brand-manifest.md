---
"@codeatlasdev/ui": patch
---

The manifest `generateBrand` / `caBrandPlugin` write is installable: `display: "standalone"` (was `"browser"`), `id` and `scope` set to `"/"`, and `theme_color` / `background_color` taken from the theme's default scheme instead of always the light one (#206). The icon hash now includes the default scheme, so switching it renames the files.
