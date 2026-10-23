---
"@codeatlasdev/ui": patch
---

`AuthLayout`: the compact mobile brand mark now sits on `--ca-brand-fill` (the surface `--ca-brand-contrast` is paired with) instead of `--ca-brand-main`, so its label holds 4.5:1 in dark on every preset. It failed color-contrast in dark at 390px on six of the eight built-in presets.
