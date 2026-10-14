---
"@codeatlasdev/ui": patch
---

Theme islands: a `data-theme-scope` inside a `data-preset` island now takes that island's preset instead of the page's. Before, the page preset's rule also matched the scope, so a brand preset on `<html>` (unlayered) always won, and between two built-ins the one emitted later in `global.css` won. The landing hero demo ignored its preset swatches because of this (#87).

Bundle budget: `styles/global.css` +122 B gzip (limit raised from 12800 to 12900 B). Each preset's scope selectors (light, dark and their `prefers-contrast: more` copies) now carry the nearer-island exclusion; `core.css` stays within its limit.
