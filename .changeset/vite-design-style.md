---
"@codeatlasdev/ui": patch
---

`@codeatlasdev/ui/vite` exports `designStyle`, `DESIGN_STYLES`, `mergeTheme` and `DesignStyleId`, so a `theme.ts` shared with `vite.config` can use a design recipe (including the 3.0 migration `designStyle("liquid", { ... })`) in plain Node. The theming guide and the `init` theme comment now point to this entry instead of `/astro`.
