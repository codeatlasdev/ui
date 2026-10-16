---
"@codeatlasdev/ui": patch
---

Native `button`, `input`, `select` and `textarea` inherit the page font (`font: inherit` in the new `ca.reset` layer, `styles/reset.css`) instead of the browser's UA font. The AppShell section header (`.ca-section__trigger` / `.ca-section__label`) and any control without its own font rule now render in `--ca-font-sans`. Component and app rules still win: the layer is the first one.
