---
"@codeatlasdev/ui": patch
---

`NavigationMenu`: Enter or Space on a trigger always toggles its panel. The click grace that lets a pointer click confirm a hover-opened panel also swallowed a keyboard activation made within 600 ms of a hover open, so a keyboard user could not close the panel.
