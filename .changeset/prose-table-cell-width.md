---
"@codeatlasdev/ui": patch
---

Prose table cells no longer have a `7rem` minimum width: short cells hug their content and the description column gets the rest. A cell marked `data-prose` keeps a readable measure (`--ca-prose-cell-min`, default `12rem`).
