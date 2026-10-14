---
"@codeatlasdev/ui": patch
---

`Select`: an option whose `value` is `""` (e.g. "All projects") is now a real selection. The trigger shows that option's label instead of the placeholder and drops the placeholder styling, so filters no longer need a sentinel value. The placeholder shows only when `value` is `undefined` or matches no option. `onchange("")` was already delivered and is now covered by a test. With `required`, a selected `""` option counts as a selection.
