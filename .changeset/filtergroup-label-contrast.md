---
"@codeatlasdev/ui": patch
---

`FilterGroup` draws its label with `--ca-text-secondary` instead of `--ca-text-hint`. The hint role can be set low by a custom preset, and the label failed the 4.5:1 axe check on a raised surface in dark mode.
