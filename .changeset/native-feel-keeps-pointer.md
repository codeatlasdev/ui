---
"@codeatlasdev/ui": patch
---

`nativeFeel()` no longer forces the arrow cursor on buttons, links, tabs, menu items and options. `html[data-ca-native]` set `cursor: default` in `ca.base`, which outranks the pointer cursor of `ca.reset`, so an app shell never showed the hand on clickable controls (nor `not-allowed` on disabled ones). The rule keeps blocking text selection and the touch callout on chrome; the cursor now comes from the reset layer alone.
